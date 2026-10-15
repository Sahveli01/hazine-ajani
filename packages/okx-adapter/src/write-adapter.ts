import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  moneySchema,
  decimalValueSchema,
  type Money,
} from "@hazine-ajani/report-schema";
import { z } from "zod";

import { resolveOkxCliInvocation } from "./read-adapter.js";

type DecimalValue = { value: string; scale: number };

export type ConfirmedDcdExecutionCommand = {
  confirmationId: string;
  analysisId: string;
  productId: string;
  amount: Money;
  notionalCurrency: string;
  minimumAnnualizedYield: DecimalValue;
};

export type OkxWriteRequest = {
  args: readonly string[];
  profile: string;
  write: true;
};

export type OkxWriteTransport = {
  execute(request: OkxWriteRequest): Promise<unknown>;
};

export type OkxWriteErrorCode =
  | "EXECUTION_DISABLED"
  | "AMOUNT_LIMIT_EXCEEDED"
  | "INVALID_COMMAND"
  | "INVALID_RESPONSE"
  | "SUBMISSION_UNKNOWN"
  | "RECONCILIATION_FAILED";

export class OkxWriteError extends Error {
  constructor(
    public readonly code: OkxWriteErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "OkxWriteError";
  }
}

const commandSchema = z.strictObject({
  confirmationId: z.string().min(1).max(128),
  analysisId: z.string().regex(/^ana_[A-Za-z0-9_-]{16,64}$/),
  productId: z.string().min(1).max(128),
  amount: moneySchema,
  notionalCurrency: z.string().regex(/^[A-Z][A-Z0-9_]{1,11}$/),
  minimumAnnualizedYield: decimalValueSchema,
});

const submitResponseSchema = z.object({
  env: z.literal("live"),
  data: z.array(z.object({ ordId: z.string().min(1) })).min(1),
});

const orderResponseSchema = z.object({
  env: z.literal("live"),
  data: z
    .array(
      z.object({
        ordId: z.string().min(1),
        state: z.enum([
          "initial",
          "live",
          "pending_settle",
          "settled",
          "pending_redeem",
          "redeemed",
          "rejected",
        ]),
      }),
    )
    .min(1),
});

function percentFromFraction(input: DecimalValue): string {
  const negative = input.value.startsWith("-");
  const unsigned = negative ? input.value.slice(1) : input.value;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const digits = BigInt(`${whole}${fraction}`).toString();
  const scale = fraction.length - 2;
  let result: string;
  if (scale <= 0) result = `${digits}${"0".repeat(-scale)}`;
  else {
    const padded = digits.padStart(scale + 1, "0");
    result = `${padded.slice(0, -scale)}.${padded.slice(-scale)}`;
  }
  result = result.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  return negative ? `-${result}` : result;
}

function clientOrderId(confirmationId: string): string {
  return createHash("sha256").update(confirmationId).digest("hex").slice(0, 32);
}

export function renderDcdSubscriptionRequest(
  input: ConfirmedDcdExecutionCommand,
): OkxWriteRequest {
  const parsed = commandSchema.safeParse(input);
  if (!parsed.success) {
    throw new OkxWriteError("INVALID_COMMAND", "Invalid confirmed DCD command");
  }
  const command = parsed.data;
  if (
    command.amount.currency !== command.notionalCurrency ||
    Number(command.amount.value) <= 0 ||
    Number(command.minimumAnnualizedYield.value) <= 0
  ) {
    throw new OkxWriteError("INVALID_COMMAND", "Invalid confirmed DCD command");
  }
  return {
    args: [
      "earn",
      "dcd",
      "quote-and-buy",
      "--productId",
      command.productId,
      "--sz",
      command.amount.value,
      "--notionalCcy",
      command.notionalCurrency,
      "--clOrdId",
      clientOrderId(command.confirmationId),
      "--minAnnualizedYield",
      percentFromFraction(command.minimumAnnualizedYield),
    ],
    profile: "",
    write: true,
  };
}

export function createDcdWriteAdapter(options: {
  executionEnabled: boolean;
  writeProfile: string;
  maximumLiveAmount: Money;
  transport: OkxWriteTransport;
}) {
  const maximumLiveAmount = moneySchema.parse(options.maximumLiveAmount);
  return {
    async submit(input: ConfirmedDcdExecutionCommand) {
      if (!options.executionEnabled) {
        throw new OkxWriteError(
          "EXECUTION_DISABLED",
          "Live OKX execution is disabled",
        );
      }
      const rendered = renderDcdSubscriptionRequest(input);
      if (
        input.amount.currency !== maximumLiveAmount.currency ||
        compareMoney(input.amount, maximumLiveAmount) > 0
      ) {
        throw new OkxWriteError(
          "AMOUNT_LIMIT_EXCEEDED",
          "Confirmed amount exceeds the server-side live execution limit",
        );
      }
      let response: unknown;
      try {
        response = await options.transport.execute({
          ...rendered,
          profile: options.writeProfile,
        });
      } catch {
        throw new OkxWriteError(
          "SUBMISSION_UNKNOWN",
          "OKX write outcome is unknown",
        );
      }
      const parsed = submitResponseSchema.safeParse(response);
      const order = parsed.success ? parsed.data.data[0] : undefined;
      if (!order) {
        throw new OkxWriteError(
          "INVALID_RESPONSE",
          "OKX write response could not be verified",
        );
      }
      return { submissionId: order.ordId };
    },

    async reconcile(orderId: string) {
      if (!options.executionEnabled) {
        throw new OkxWriteError(
          "EXECUTION_DISABLED",
          "Live OKX execution is disabled",
        );
      }
      let response: unknown;
      try {
        response = await options.transport.execute({
          args: ["earn", "dcd", "order", "--ordId", orderId],
          profile: options.writeProfile,
          write: true,
        });
      } catch {
        throw new OkxWriteError(
          "RECONCILIATION_FAILED",
          "OKX order state is unavailable",
        );
      }
      const parsed = orderResponseSchema.safeParse(response);
      const order = parsed.success ? parsed.data.data[0] : undefined;
      if (!order || order.ordId !== orderId) {
        throw new OkxWriteError(
          "INVALID_RESPONSE",
          "OKX order state could not be verified",
        );
      }
      const status =
        order.state === "initial" ||
        order.state === "pending_settle" ||
        order.state === "pending_redeem"
          ? ("PENDING" as const)
          : order.state === "rejected"
            ? ("FAILED" as const)
            : ("CONFIRMED" as const);
      return { status, orderId: order.ordId, okxState: order.state };
    },
  };
}

function compareMoney(left: Money, right: Money): number {
  const scale = Math.max(left.scale, right.scale);
  const scaled = (money: Money) => {
    const [whole = "0", fraction = ""] = money.value.split(".");
    const digits = BigInt(`${whole}${fraction}`);
    return digits * 10n ** BigInt(scale - fraction.length);
  };
  const difference = scaled(left) - scaled(right);
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

const executeFile = promisify(execFile);

export function createCliWriteTransport(
  options: { timeoutMs?: number } = {},
): OkxWriteTransport {
  return {
    async execute(request) {
      const command = request.args.slice(0, 4).join(" ");
      if (
        command !== "earn dcd quote-and-buy --productId" &&
        command !== "earn dcd order --ordId"
      ) {
        throw new OkxWriteError(
          "INVALID_COMMAND",
          "Command is outside the DCD write allowlist",
        );
      }
      if (!request.profile) {
        throw new OkxWriteError(
          "INVALID_COMMAND",
          "A separate OKX write profile is required",
        );
      }
      const invocation = resolveOkxCliInvocation();
      try {
        const { stdout } = await executeFile(
          invocation.executable,
          [
            ...invocation.prefixArgs,
            "--profile",
            request.profile,
            "--live",
            "--json",
            "--env",
            ...request.args,
          ],
          {
            timeout: options.timeoutMs ?? 20_000,
            windowsHide: true,
            maxBuffer: 1_000_000,
          },
        );
        return JSON.parse(stdout) as unknown;
      } catch {
        throw new OkxWriteError(
          command.includes("quote-and-buy")
            ? "SUBMISSION_UNKNOWN"
            : "RECONCILIATION_FAILED",
          command.includes("quote-and-buy")
            ? "OKX write outcome is unknown"
            : "OKX order state is unavailable",
        );
      }
    },
  };
}
