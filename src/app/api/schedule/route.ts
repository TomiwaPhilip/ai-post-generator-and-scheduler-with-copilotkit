import { NextRequest, NextResponse } from "next/server";
import { scheduleJobs } from "@/worker";
import cron from "node-cron";
import mongoose from 'mongoose';
import Schedule from './models/Schedule';
import connectToDB from "@/app/util";

export async function POST(req: NextRequest) {
    const { schedule } = await req.json();
    console.log(schedule);
    try {
        await connectToDB();
        const newSchedule = new Schedule({ schedule });
        await newSchedule.save();

        cron.schedule('15 * * * * *', async () => {
            console.log('Triggering jobs...');
            await scheduleJobs(schedule);
        });

        return NextResponse.json(
            { message: "Schedule updated!", schedule },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "Error updating schedule", error },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await connectToDB();

        const latestSchedule = await Schedule.findOne().sort({ createdAt: -1 });
        if (latestSchedule) {
            return NextResponse.json(
                { message: "Schedule found", schedule: latestSchedule.schedule },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                { message: "No schedule found" },
                { status: 404 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { message: "Error retrieving schedule", error },
            { status: 500 }
        );
    }
}
