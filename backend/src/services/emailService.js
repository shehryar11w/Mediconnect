const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const path = require("path");

class EmailService {
    constructor() {
        // Load credentials from service account JSON file
        const credentials = require(
            path.join(process.cwd(), "src/services/credentials.json"),
        );

        this.oauth2Client = new google.auth.OAuth2(
            credentials.installed.client_id,
            credentials.installed.client_secret,
            credentials.installed.redirect_uris[0],
        );

        this.oauth2Client.setCredentials({
            refresh_token: credentials.installed.refresh_token,
        });

        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.GMAIL_USER,
                clientId: credentials.installed.client_id,
                clientSecret: credentials.installed.client_secret,
                refreshToken: credentials.installed.refresh_token,
                accessToken: this.oauth2Client.getAccessToken(),
            },
        });
    }

    async sendEmail(to, subject, html) {
        try {
            const mailOptions = {
                from: process.env.GMAIL_USER,
                to,
                subject,
                html,
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log("Email sent:", info.messageId);
            return info;
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }

    async sendNewAppointmentEmail(appointment, patient, doctor) {
        const patientSubject = "New Appointment Confirmation";
        const patientHtml = `
      <h2>Appointment Confirmation</h2>
      <p>Dear ${patient.PatientName},</p>
      <p>Your appointment with Dr. ${doctor.DoctorName} has been scheduled for:</p>
      <p><strong>Date:</strong> ${new Date(appointment.AppointmentStartDateTime).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${new Date(appointment.AppointmentStartDateTime).toLocaleTimeString()}</p>
      <p>Please arrive 10 minutes before your scheduled time.</p>
      <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
      <p>Best regards,<br>Medi-Connect Team</p>
    `;

        const doctorSubject = "New Appointment Request";
        const doctorHtml = `
      <h2>New Appointment Request</h2>
      <p>Dear Dr. ${doctor.DoctorName},</p>
      <p>You have a new appointment request from ${patient.PatientName}:</p>
      <p><strong>Date:</strong> ${new Date(appointment.AppointmentStartDateTime).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${new Date(appointment.AppointmentStartDateTime).toLocaleTimeString()}</p>
      <p>Please review and confirm this appointment in your dashboard.</p>
      <p>Best regards,<br>Medi-Connect Team</p>
    `;

        await Promise.all([
            this.sendEmail(patient.PatientEmail, patientSubject, patientHtml),
            this.sendEmail(doctor.DoctorEmail, doctorSubject, doctorHtml),
        ]);
    }

    async sendRescheduledAppointmentEmail(appointment, patient, doctor) {
        const patientSubject = "Appointment Rescheduled";
        const patientHtml = `
      <h2>Appointment Rescheduled</h2>
      <p>Dear ${patient.PatientName},</p>
      <p>Your appointment with Dr. ${doctor.DoctorName} has been rescheduled to:</p>
      <p><strong>New Date:</strong> ${new Date(appointment.AppointmentStartDateTime).toLocaleDateString()}</p>
      <p><strong>New Time:</strong> ${new Date(appointment.AppointmentStartDateTime).toLocaleTimeString()}</p>
      <p>Please arrive 10 minutes before your scheduled time.</p>
      <p>If you need to make any changes, please contact us.</p>
      <p>Best regards,<br>Medi-Connect Team</p>
    `;

        const doctorSubject = "Appointment Rescheduled";
        const doctorHtml = `
      <h2>Appointment Rescheduled</h2>
      <p>Dear Dr. ${doctor.DoctorName},</p>
      <p>The appointment with ${patient.PatientName} has been rescheduled to:</p>
      <p><strong>New Date:</strong> ${new Date(appointment.AppointmentStartDateTime).toLocaleDateString()}</p>
      <p><strong>New Time:</strong> ${new Date(appointment.AppointmentStartDateTime).toLocaleTimeString()}</p>
      <p>Please update your schedule accordingly.</p>
      <p>Best regards,<br>Medi-Connect Team</p>
    `;

        await Promise.all([
            this.sendEmail(patient.PatientEmail, patientSubject, patientHtml),
            this.sendEmail(doctor.DoctorEmail, doctorSubject, doctorHtml),
        ]);
    }

    async sendCancelledAppointmentEmail(appointment, patient, doctor) {
        const patientSubject = "Appointment Cancelled";
        const patientHtml = `
      <h2>Appointment Cancelled</h2>
      <p>Dear ${patient.PatientName},</p>
      <p>Your appointment with Dr. ${doctor.DoctorName} has been cancelled.</p>
      <p>If you would like to schedule a new appointment, please contact us.</p>
      <p>Best regards,<br>Medi-Connect Team</p>
    `;

        const doctorSubject = "Appointment Cancelled";
        const doctorHtml = `
      <h2>Appointment Cancelled</h2>
      <p>Dear Dr. ${doctor.DoctorName},</p>
      <p>The appointment with ${patient.PatientName} has been cancelled.</p>
      <p>This time slot is now available for other appointments.</p>
      <p>Best regards,<br>Medi-Connect Team</p>
    `;

        await Promise.all([
            this.sendEmail(patient.PatientEmail, patientSubject, patientHtml),
            this.sendEmail(doctor.DoctorEmail, doctorSubject, doctorHtml),
        ]);
    }

    async sendCompletedAppointmentEmail(appointment, patient, doctor) {
        const subject = "Appointment Completed - Feedback Requested";
        const html = `
      <h2>Appointment Completed</h2>
      <p>Dear ${patient.PatientName},</p>
      <p>Your appointment with Dr. ${doctor.DoctorName} has been completed.</p>
      <p>We value your feedback! Please take a moment to rate your experience and provide any comments you may have.</p>
      <p>Your feedback helps us improve our services and helps other patients make informed decisions.</p>
      <p>Best regards,<br>Medi-Connect Team</p>
    `;

        await this.sendEmail(patient.PatientEmail, subject, html);
    }

    async sendPasswordResetEmail(email, token) {
        const subject = "Password Reset Request";
        const html = `
      <h2>Password Reset Request</h2>
      <p>Dear ${email},</p>
      <p>You have requested a password reset. Please use the code below to reset your password:</p>
      <p><strong>Code:</strong> ${token}</p>
      <p>This code will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p>Best regards,<br>Medi-Connect Team</p>
    `;

        await this.sendEmail(email, subject, html);
    }
}

module.exports = new EmailService();
