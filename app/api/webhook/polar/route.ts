import { db } from "@/db";
import { NextResponse } from "next/server";
import { subscription } from "@/db/schema";
import { Webhooks } from "@polar-sh/nextjs";

function safeParseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}

// 原来这里在模块顶层 throw，会导致离线构建直接失败（本地版永远不会有这个密钥）。
// 改成没配密钥时该路由返回 501，构建期不再炸。
const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

export const POST = webhookSecret
  ? Webhooks({
      webhookSecret,
      onPayload: async ({ data, type }) => {
        if (
          type === "subscription.created" ||
          type === "subscription.active" ||
          type === "subscription.canceled" ||
          type === "subscription.revoked" ||
          type === "subscription.uncanceled" ||
          type === "subscription.updated"
        ) {
          console.log("🎯 Processing subscription webhook:", type);
          console.log("📦 Payload data:", JSON.stringify(data, null, 2));
          try {
            const userId = data.customer?.externalId;

            const subscriptionData = {
              id: data.id,
              createdAt: new Date(data.createdAt),
              modifiedAt: safeParseDate(data.modifiedAt),
              amount: data.amount,
              currency: data.currency,
              recurringInterval: data.recurringInterval,
              status: data.status,
              currentPeriodStart: safeParseDate(data.currentPeriodStart) || new Date(),
              currentPeriodEnd: safeParseDate(data.currentPeriodEnd) || new Date(),
              cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
              canceledAt: safeParseDate(data.canceledAt),
              startedAt: safeParseDate(data.startedAt) || new Date(),
              endsAt: safeParseDate(data.endsAt),
              endedAt: safeParseDate(data.endedAt),
              customerId: data.customerId,
              productId: data.productId,
              discountId: data.discountId || null,
              checkoutId: data.checkoutId || "",
              customerCancellationReason: data.customerCancellationReason || null,
              customerCancellationComment: data.customerCancellationComment || null,
              metadata: data.metadata ? JSON.stringify(data.metadata) : null,
              customFieldData: data.customFieldData ? JSON.stringify(data.customFieldData) : null,
              userId: userId as string | null,
            };

            console.log("💾 Final subscription data:", {
              id: subscriptionData.id,
              status: subscriptionData.status,
              userId: subscriptionData.userId,
              amount: subscriptionData.amount,
            });

            await db
              .insert(subscription)
              .values(subscriptionData)
              .onConflictDoUpdate({
                target: subscription.id,
                set: {
                  modifiedAt: subscriptionData.modifiedAt || new Date(),
                  amount: subscriptionData.amount,
                  currency: subscriptionData.currency,
                  recurringInterval: subscriptionData.recurringInterval,
                  status: subscriptionData.status,
                  currentPeriodStart: subscriptionData.currentPeriodStart,
                  currentPeriodEnd: subscriptionData.currentPeriodEnd,
                  cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
                  canceledAt: subscriptionData.canceledAt,
                  startedAt: subscriptionData.startedAt,
                  endsAt: subscriptionData.endsAt,
                  endedAt: subscriptionData.endedAt,
                  customerId: subscriptionData.customerId,
                  productId: subscriptionData.productId,
                  discountId: subscriptionData.discountId,
                  checkoutId: subscriptionData.checkoutId,
                  customerCancellationReason: subscriptionData.customerCancellationReason,
                  customerCancellationComment: subscriptionData.customerCancellationComment,
                  metadata: subscriptionData.metadata,
                  customFieldData: subscriptionData.customFieldData,
                  userId: subscriptionData.userId,
                },
              });

            console.log("🎉 Subscription data upserted successfully");
          } catch (error) {
            console.error("❌ Error processing subscription webhook:", error);
          }
        }
      },
    })
  : async () =>
      new NextResponse("POLAR_WEBHOOK_SECRET 未配置，离线版本地不接受支付回调", { status: 501 });
