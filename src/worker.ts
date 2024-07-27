"use server";

import mongoose from "mongoose";
import connectToDB from "./app/util";

// Define Job Schema and Model
const jobSchema = new mongoose.Schema({
	name: String,
	data: Object,
	status: {
		type: String,
		enum: ['pending', 'completed'],
		default: 'pending'
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

// Add Jobs to MongoDB
export const scheduleJobs = async (schedule: any) => {
	await connectToDB();

	const now = new Date();
	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();
	const currentDay = now.getDay();

	console.log(`Current Time: ${currentHour}:${currentMinute}, Day: ${currentDay}`);
	console.log('Schedule:', schedule);

	const currentSchedule = schedule.find((item: any) => item.time === currentHour);
	if (!currentSchedule) {
		console.log('No current schedule found for the current hour.');
		return;
	}

	const schedulesForTheHour = currentSchedule.schedule[currentDay];
	if (!schedulesForTheHour || schedulesForTheHour.length === 0) {
		console.log('No schedules for the current hour and day.');
		return;
	}

	const awaitingJobs = schedulesForTheHour.filter(
		(scheduleItem: any) => scheduleItem.minutes && scheduleItem.minutes <= currentMinute
	);

	if (awaitingJobs.length === 0) {
		console.log('No jobs to schedule at this time.');
		return;
	}

	for (const scheduleItem of awaitingJobs) {
		const job = new Job({
			name: 'jobs',
			data: {
				message: scheduleItem.content
			}
		});
		await job.save();
		console.log(`Job ${job._id} added to database`);
	}
};

// Process Jobs from MongoDB
export const processJobs = async () => {
	try {
		await connectToDB();
		const pendingJobs = await Job.find({ status: 'pending' });

		if (!pendingJobs.length) {
			console.log("No pending jobs to process.");
			return;
		}

		console.log("Jobs pending:", pendingJobs);

		for (const job of pendingJobs) {
			console.log(`Processing job ${job._id} with data: ${job.data.message}`);
			console.log('Posting content...');

			try {
				const response = await fetch('https://api.twitter.com/2/tweets', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${process.env.TWITTER_ACCESS_TOKEN}`
					},
					body: JSON.stringify({ text: job.data.message })
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(`Failed to post content for job ${job._id}: ${JSON.stringify(errorData)}`);
				}

				console.log('Content posted!');
				job.status = 'completed';
				await job.save();
				console.log(`${job._id} has completed!`);

			} catch (postError: any) {
				console.error(`Error posting content for job ${job._id}:`, postError.message);
			}
		}
	} catch (dbError: any) {
		console.error("Error connecting to the database or retrieving jobs:", dbError.message);
	}
};


// Set interval to process jobs every minute
setInterval(processJobs, 60000);
