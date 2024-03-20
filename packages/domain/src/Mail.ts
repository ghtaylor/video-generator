export type MailContent = {
  subject: string;
  body: string;
};

export type Mail = {
  fromEmail: string;
  toEmail: string;
  content: MailContent;
};
