
import { NextResponse } from "next/server";
import connectionToDatabase from "../../../../lib/mongoose";
import RestuarentUser from "../../../../models/RegisterUser";

export async function POST(req) {
    try {
        await connectionToDatabase();
        const { restId, token } = await req.json();

        if (!restId || !token) {
            return NextResponse.json(
                { success: false, message: "Missing restId or token" },
                { status: 400 }
            );
        }

        // Find the user by restId and update the fcmToken
        const updatedUser = await RestuarentUser.findOneAndUpdate(
            { restId: restId },
            {
                $addToSet: { fcmTokens: token }, // Add to array unique
                $set: { fcmToken: token }       // Keep legacy field updated just in case
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Token saved successfully",
        });
    } catch (error) {
        console.error("Error saving FCM token:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
