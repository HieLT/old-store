const nodemailer = require("nodemailer");

class MailService{
  async sendMail (options:any){
    try{
      const transporter = nodemailer.createTransport({
        host: process.env.SMPT_HOST,
        port: process.env.SMPT_PORT,
        service: process.env.SMPT_SERVICE,
        auth: {
          user: process.env.SMPT_MAIL,
          pass: process.env.SMPT_PASSWORD,
        },
      });
  
      const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: options.email,
        subject: options.subject,
        text: options.message || '',
        html: options.htmlTemplate || ''
      };
  
      await transporter.sendMail(mailOptions);
      return;
    }
    catch (error){
      console.error("Không gửi được email, kiểm tra lại tài khoản email");
      throw error;
    }
  };
}

export default new MailService()