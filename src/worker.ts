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
export const scheduleJobs = async (schedule) => {
	await connectToDB();

	const now = new Date();
	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();
	const currentDay = now.getDay();

	console.log(`Current Time: ${currentHour}:${currentMinute}, Day: ${currentDay}`);
	console.log('Schedule:', schedule);

	const currentSchedule = schedule.find((item) => item.time === currentHour);
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
		(scheduleItem) => scheduleItem.minutes && scheduleItem.minutes <= currentMinute
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
	await connectToDB();
	const pendingJobs = await Job.find({ status: 'pending' });

	console.log("Jobs pending:", pendingJobs);

	for (const job of pendingJobs) {
		console.log(`Processing job ${job._id} with data: ${job.data.message}`);
		console.log('Posting content...');

		const postTweet = await fetch('https://api.twitter.com/2/tweets', {
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
				Authorization: `Bearer ${process.env.TWITTER_ACCESS_TOKEN}`
			},
			body: JSON.stringify({ text: job.data.message })
		});

		if (postTweet.ok) {
			console.log('Content posted!');
			job.status = 'completed';
			await job.save();
			console.log(`${job._id} has completed!`);
		} else {
			console.log(`Failed to post content for job ${job._id}`);
		}
	}
};

// Set interval to process jobs every minute
setInterval(processJobs, 60000);
