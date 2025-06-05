"use client";

import { useState, useEffect, useCallback, use } from "react";
import { Button } from "@/components/ui/button";
import { getUser, getCustomerLogsById } from "@/app/actions";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react"
import type { ProductLog } from "app-types/product-logs";
import type { User } from "app-types/user";



interface OrderDetailPageProps {
  params: Promise<{ id: string }>;   // was { id: string }
}


export default function OrderDetailPage({ params }: OrderDetailPageProps) {

  const { id: idStr } = use(params);

  // convert to number once unwrapped
  const id = parseInt(idStr, 10);

  const [users, setUsers] = useState<{ [key: number]: User }>({});
  const [orderLogData, setOrderLogData] = useState<ProductLog[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id));


  const fetchOrderData = useCallback(async () => {
    try {
      const orderLogs = await getCustomerLogsById(id);

      if (!orderLogs || orderLogs.length === 0) {
        setOrderLogData(null);
        return;
      }

      setOrderLogData(orderLogs);

      const uniqueUserIds = Array.from(
        new Set(orderLogs.map((log: ProductLog) => log.user).filter(Boolean))
      ) as number[];

      const userFetches = await Promise.all(
        uniqueUserIds.map((userId) => getUser(userId))
      );

      const usersById: { [key: number]: User } = {};

      uniqueUserIds.forEach((userId, index) => {
        if (userFetches[index]) {
          const user = userFetches[index];
          usersById[userId] = {
            ...user,
            createdAt: user.createdAt ? user.createdAt.toISOString() : null,
            phone: user.phone.toString(),  
          };
        }
      });


      setUsers(usersById);
    } catch (error) {
      console.error("Error fetching order data:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);


  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  return (
    <div className="max-w-8xl">
      <Card className="shadow-lg border-t-primary border-b-primary print:shadow-none print:border">
        <CardContent className="p-2">
          {loading ? (
            <div className="flex justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              <div className="lg:col-span-2 space-y-4">
                {orderLogData && orderLogData.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-primary dark:text-primary">Customer Logs</h3>
                    <div className="bg-white dark:bg-gray-800 border rounded-md p-3 space-y-2">
                      {orderLogData.map((log) => {
                        const isOpen = openId === log.id;
                        const editedBy = log.user ? users[log.user]?.name : "Unknown User";

                        return (
                          <div key={log.id} className="border border-gray-300 dark:border-gray-600 rounded-md">
                            <button
                              type="button"
                              onClick={() => toggle(log.id)}
                              className="flex w-full items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition"
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {log.action}
                              </span>
                              <svg
                                className={`w-4 h-4 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {isOpen && (
                              <div className="pl-3 dark:bg-gray-800 text-sm space-y-3 p-2">
                                <p className="text-gray-800 dark:text-gray-300">
                                  <span className="font-semibold">Edited by:</span>{" "}
                                  {editedBy ?? "Unknown User"}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {log.createdAt
                                    ? new Date(log.createdAt).toLocaleString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                    : "Date N/A"}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="flex justify-end mr-20 text-gray-600 p-5 dark:text-gray-400">No logs found.</p>
                )}

              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-gray-50 dark:bg-gray-800 border-t p-4 print:hidden">
          <div className="flex justify-end w-full">
            <Button

              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
