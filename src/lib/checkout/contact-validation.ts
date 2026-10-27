export type CheckoutFieldErrors = Partial<Record<"firstName" | "lastName" | "phone" | "email" | "cityRef" | "branchRef" | "consent", string>>;
type Contact = { firstName: string; lastName: string; phone: string; email: string; city: string; consent: string };
export function checkoutContactErrors(contact: Contact): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  if (!contact.firstName.trim()) errors.firstName = "Вкажіть ім’я";
  if (!contact.lastName.trim()) errors.lastName = "Вкажіть прізвище";
  if (!contact.phone.trim()) errors.phone = "Вкажіть телефон";
  if (!/^\S+@\S+\.\S+$/.test(contact.email.trim())) errors.email = "Вкажіть коректний e-mail";
  if (!contact.city.trim()) errors.cityRef = "Оберіть місто зі списку";
  if (contact.consent !== "accepted") errors.consent = "Підтвердьте згоду з умовами";
  return errors;
}
