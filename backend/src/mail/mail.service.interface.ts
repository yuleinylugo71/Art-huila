export interface IMailService {
  sendVerificationEmail(
    to: string,
    name: string,
    token: string,
    frontendUrl: string,
  ): Promise<void>;
  sendArtisanApprovalEmail(to: string, name: string): Promise<void>;
  sendArtisanRejectionEmail(
    to: string,
    name: string,
    reason: string,
  ): Promise<void>;
  sendArtisanSuspensionEmail(to: string, name: string): Promise<void>;
  sendOrderConfirmationEmail(
    to: string,
    name: string,
    orderId: string,
    total: number,
  ): Promise<void>;
  sendSaleNotificationEmail(
    to: string,
    artisanName: string,
    productName: string,
    quantity: number,
  ): Promise<void>;
  sendArtisanResponseEmail(
    to: string,
    buyerName: string,
    artisanName: string,
    productName: string,
  ): Promise<void>;
  sendPasswordResetEmail(
    to: string,
    token: string,
    userName: string,
  ): Promise<void>;
}

export const MAIL_SERVICE = 'MAIL_SERVICE';
