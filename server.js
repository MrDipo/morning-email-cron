import express from "express";
import cron from "node-cron";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});

const sendGoodMorningEmail = async () => {
	const mailOptions = {
		from: "from@example.com",
		to: "to@example.com",
		subject: "Good Morning!",
		text: "Good morning",
		html: "<h1>Good morning</h1><p>This email was sent automatically by a cron job!</p>",
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		console.log(`[${new Date().toISOString()}] Email sent successfully!`);
		console.log("Message ID:", info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error(`[${new Date().toISOString()}] Error sending email:`, error);
		return { success: false, error: error.message };
	}
};

/*
	CRON JOB: Runs every day at 8:00 AM WAT (West Africa Time)
	Cron expression: 'minute hour day month dayOfWeek'
	'0 8 * * *' means: at minute 0, hour 8, every day, every month, every day of week
	Note: node-cron uses local server time, so there is a need to account for timezone
*/
cron.schedule(
	"0 8 * * *",
	async () => {
		console.log(
			`[${new Date().toISOString()}] Cron job triggered - sending good morning email...`
		);
		await sendGoodMorningEmail();
	},
	{
		scheduled: true,
		timezone: "Africa/Lagos",
	}
);

console.log("Cron job scheduled: Will send email every day at 8:00 AM WAT");

// Health check
app.get("/", (req, res) => {
	res.send({
		status: "running",
		message: "Good Morning Email Cron Service",
		nextRun: "Daily at 8:00 AM WAT",
		timestamp: new Date().toISOString(),
	});
});

// Manual trigger for testing
app.post("/", async (req, res) => {
	console.log(`[${new Date().toISOString()}] Manual email trigger requested`);
	const result = await sendGoodMorningEmail();

	if (result.success) {
		res.send({
			success: true,
			message: "Email sent successfully",
			messageId: result.messageId,
		});
	} else {
		res.status(500).send({
			success: false,
			message: "Failed to send email",
			error: result.error,
		});
	}
});

app.get("/status", (req, res) => {
	res.send({
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
		timezone: "Africa/Lagos",
	});
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
	console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
	console.log(`Health check available at: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("SIGTERM received, shutting down gracefully...");
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("SIGINT received, shutting down gracefully...");
	process.exit(0);
});
