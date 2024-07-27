import data from './user.json';
import mongoose from "mongoose";

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

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	throw new Error("MONGODB_URI not provided")
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('Connected to MongoDB');
});

// Add Jobs to MongoDB
export const scheduleJobs = async (schedule: any) => {
	const now = new Date();
	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();
	const currentDay = now.getDay();

	const currentSchedule = schedule.find((item: any) => item.time === currentHour);
	const schedulesForTheHour = currentSchedule?.schedule[currentDay];

	if (schedulesForTheHour && schedulesForTheHour.length > 0) {
		const awaitingJobs = schedulesForTheHour.filter(
			(scheduleItem: any) =>
				scheduleItem.minutes && scheduleItem.minutes <= currentMinute
		);

		return awaitingJobs.map(async (scheduleItem: any) => {
			const job = new Job({
				name: 'jobs',
				data: {
					message: scheduleItem.content
				}
			});
			await job.save();
			console.log(`Job ${job._id} added to database`);
		});
	}
};

// Process Jobs from MongoDB
const processJobs = async () => {
	const pendingJobs = await Job.find({ status: 'pending' });

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
		}
	}
};

// Set interval to process jobs every minute
setInterval(processJobs, 60000);
