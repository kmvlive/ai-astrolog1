<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\TBankService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function handle(Request $request, TBankService $tbank)
    {
        $data = $request->all();
        Log::info('TBank webhook', $data);

        // Проверка подписи
        if (!$tbank->verify($data)) {
            Log::warning('TBank webhook: invalid signature', $data);
            return response()->json(['error' => 'bad signature'], 400);
        }

        $paymentId = $data['PaymentId'] ?? null;
        $status = $data['Status'] ?? '';

        if (!$paymentId) {
            return response()->json(['error' => 'no PaymentId'], 400);
        }

        $payment = Payment::where('tbank_payment_id', $paymentId)->first();
        if (!$payment) {
            Log::warning('TBank webhook: payment not found', ['payment_id' => $paymentId]);
            return response()->json(['error' => 'not found'], 404);
        }

        $payment->update(['payload' => $data]);

        // Активируем только при подтверждении
        if (in_array($status, ['CONFIRMED', 'AUTHORIZED'])) {
            app(PaymentController::class)->activate($payment);

            // Сохраняем токен карты для автопродления
            if ($payment->auto_renew && !empty($data['RebillId'])) {
                \App\Models\Subscription::where('user_id', $payment->user_id)
                    ->orderByDesc('id')
                    ->first()
                    ?->update([
                        'rebill_id' => $data['RebillId'],
                        'auto_renew' => true,
                    ]);
                Log::info('RebillId сохранён', ['user' => $payment->user_id, 'rebill' => $data['RebillId']]);
            }
        } elseif ($status === 'REJECTED' || $status === 'CANCELLED' || $status === 'REFUNDED') {
            $payment->update(['status' => 'FAILED']);
        }

        return response()->json(['success' => true]);
    }
}
