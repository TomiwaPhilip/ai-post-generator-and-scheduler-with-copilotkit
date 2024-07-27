// models/Schedule.js
import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    schedule: Object,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);

export default Schedule;
