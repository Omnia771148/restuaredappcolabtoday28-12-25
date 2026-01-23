
import { NextResponse } from "next/server";
import { admin, initFirebaseAdmin } from "../../../../lib/firebaseAdmin";
import RestuarentUser from "../../../../models/RegisterUser";
import connectionToDatabase from "../../../../lib/mongoose";

export async function POST(req) {
    try {
        // Ensure Firebase message is initialized
        initFirebaseAdmin();

        await connectionToDatabase();
        const { restaurantId, title, body } = await req.json();

        if (!restaurantId) {
            return NextResponse.json({ success: false, message: "Missing restaurantId" }, { status: 400 });
        }

        // Find the restaurant user with this restId
        const user = await RestuarentUser.findOne({ restId: restaurantId });

        if (!user || (!user.fcmToken && (!user.fcmTokens || user.fcmTokens.length === 0))) {
            console.log(`No FCM token found for restaurant: ${restaurantId}`);
            return NextResponse.json({ success: false, message: "No FCM token registered for this restaurant" }, { status: 404 });
        }

        // Collect all tokens (handle legacy single token + new array of tokens)
        let tokens = user.fcmTokens || [];
        if (user.fcmToken && !tokens.includes(user.fcmToken)) {
            tokens.push(user.fcmToken);
        }
        // Remove duplicates and empty strings
        tokens = [...new Set(tokens)].filter(t => t);

        if (tokens.length === 0) {
            return NextResponse.json({ success: false, message: "No valid FCM tokens found" }, { status: 404 });
        }

        const message = {
            // notification: {
            //     title: title || "New Order Received!",
            //     body: body || "You have a new order waiting.",
            // },
            data: {
                title: title || "New Order Received!",
                body: body || "You have a new order waiting.",
                url: "/orders",
                click_action: "/orders"
            },
            tokens: tokens, // sendEachForMulticast uses 'tokens' array

            // Android specific: High Priority is KEY for waking up devices
            android: {
                priority: 'high',
                ttl: 60 * 60 * 24, // 24 hours
                notification: {
                    channelId: 'default',
                    priority: 'high',
                    defaultSound: true,
                    defaultVibrateTimings: true,
                    sound: 'default',
                    visibility: 'public',
                    icon: 'stock_ticker_update',
                    color: '#ff9800' // Brand color
                }
            },

            // iOS / Apple Web Push specific
            // Note: iOS Web Push requires the user to Add to Home Screen
            webpush: {
                headers: {
                    Urgency: 'high',
                    'TTL': '86400' // 24 hours
                },
                fcmOptions: {
                    link: "/orders"
                },
                notification: {
                    icon: '/icons/icon-192x192.png',
                    requireInteraction: true,
                    renotify: true,
                    tag: 'new-order',
                    // Adding title/body here again ensures it is picked up by system if data-only silent push fails to wake SW
                    title: title || "New Order Received!",
                    body: body || "You have a new order waiting."
                }
            }
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log("Successfully sent message:", response);

        // Optional: Clean up invalid tokens if needed
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            console.log('List of tokens that caused failures: ' + failedTokens);
            // We could remove them from DB here, but let's keep it simple for now and just log.
        }

        return NextResponse.json({ success: true, message: "Notification sent", response });
    } catch (error) {
        console.error("Error sending notification:", error);
        return NextResponse.json({ success: false, message: "Error sending notification", error: error.message }, { status: 500 });
    }
}
