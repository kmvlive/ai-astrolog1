<?php

namespace App\Services;

use App\Models\Payment;

class TBankService
{
    private string $terminal;
    private string $password;
    private string $baseUrl;

    public function __construct()
    {
        $this->terminal  = env('TBANK_TERMINAL_KEY', 'Test');
        $this->password  = env('TBANK_PASSWORD', 'test');
        $this->baseUrl   = rtrim(env('TBANK_BASE_URL', 'https://securepay.tinkoff.ru/v2'), '/');
    }

    public function init(Payment $payment, bool $recurrent = false): array
    {
        $params = [
            'TerminalKey' => $this->terminal,
            'Amount'      => $payment->amount,
            'OrderId'     => (string) $payment->id,
            'Description' => 'AI Астролог — тариф «' . $payment->plan->name . '»',
            'PayType'     => 'O', // одностадийная оплата
            'SuccessURL'  => 'https://my.neiro-astro.ru/payment/success',
            'FailURL'     => 'https://my.neiro-astro.ru/payment/fail',
        ];

        if ($recurrent) {
            $params['Recurrent'] = 'Y'; // привязка карты для автопродления
        }
        $params['Token'] = $this->sign($params);

        return $this->request('Init', $params);
    }

    /** Рекуррентное списание с привязанной карты */
    public function chargeRebill(string $rebillId, int $amount, string $orderId, string $description): array
    {
        $params = [
            'TerminalKey' => $this->terminal,
            'Amount'      => $amount,
            'OrderId'     => $orderId,
            'RebillId'    => $rebillId,
            'Description' => $description,
            'PayType'     => 'O',
        ];
        $params['Token'] = $this->sign($params);
        return $this->request('Charge', $params);
    }

    /** Полный возврат средств */
    public function reverse(string $paymentId, int $amount): array
    {
        $params = [
            'TerminalKey' => $this->terminal,
            'PaymentId'   => $paymentId,
            'Amount'      => $amount,
        ];
        $params['Token'] = $this->sign($params);
        return $this->request('Reverse', $params);
    }

    public function getState(string $paymentId): array
    {
        $params = [
            'TerminalKey' => $this->terminal,
            'PaymentId'   => $paymentId,
        ];
        $params['Token'] = $this->sign($params);

        return $this->request('GetState', $params);
    }

    /** Проверка подписи вебхука от Т-Банка */
    public function verify(array $data): bool
    {
        $token = $data['Token'] ?? '';
        if ($token === '') return false;
        return hash_equals($this->sign($data), $token);
    }

    /**
     * Подпись по документации Т-Банка:
     * 1. Берём все параметры корневого уровня (кроме Data и Token)
     * 2. Добавляем {"Password": "<password>"}
     * 3. Сортируем по алфавиту ключей (ksort)
     * 4. Конкатенируем значения (boolean → "true"/"false", массивы пропускаем)
     * 5. SHA-256
     */
    private function sign(array $params): string
    {
        unset($params['Data'], $params['Token'], $params['Receipt'], $params['Shops']);

        $params['Password'] = $this->password;
        ksort($params);

        $values = '';
        foreach ($params as $v) {
            if (is_bool($v)) {
                $values .= $v ? 'true' : 'false';
            } elseif (is_array($v) || $v === null) {
                continue;
            } else {
                $values .= (string) $v;
            }
        }

        return hash('sha256', $values);
    }

    private function request(string $method, array $params): array
    {
        $verify = filter_var(env('TBANK_SSL_VERIFY', true), FILTER_VALIDATE_BOOLEAN);

        $ch = curl_init($this->baseUrl . '/' . $method);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($params),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => $verify,
            CURLOPT_SSL_VERIFYHOST => $verify ? 2 : 0,
        ]);
        $raw = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($raw === false) {
            return ['Success' => false, 'Message' => 'curl: ' . $err];
        }
        return json_decode($raw, true) ?: ['Success' => false, 'Message' => 'bad json'];
    }
}
