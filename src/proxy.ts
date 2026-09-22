import { NextResponse, type NextRequest } from "next/server";

/**
 * Платіжна сторінка може повернути покупця на адресу повернення методом
 * POST із результатом платежу у формі. Сторінки Next відповідають лише на GET,
 * тож таке повернення падало з 405: гроші списані, замовлення в CRM оплачене,
 * а покупець бачить «Сторінка не працює».
 *
 * Тіло цього POST свідомо ігноруємо. Чи оплачено замовлення, вітрина дізнається
 * від CRM, яка звіряє підписаний серверний callback провайдера, — браузеру, що
 * прийшов із платіжної форми, вірити не можна.
 *
 * Саме 303: на відміну від 307/308 він зобов'язує браузер повторити запит як
 * GET. Повторний GET проходить повз цю гілку, тож циклу немає.
 */
export function proxy(request: NextRequest) {
  if (request.method === "POST") {
    return NextResponse.redirect(request.nextUrl, 303);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/order/:orderId", "/checkout/success/:orderId"],
};
