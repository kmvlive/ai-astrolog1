<?php

return [
    'confirmed' => 'Поле :attribute не совпадает с подтверждением.',
    'date' => 'Поле :attribute должно быть корректной датой.',
    'email' => 'Поле :attribute должно быть корректным email-адресом.',
    'min' => ['string' => 'Поле :attribute должно содержать минимум :min символов.', 'numeric' => 'Поле :attribute должно быть не меньше :min.'],
    'max' => ['string' => 'Поле :attribute не должно превышать :max символов.', 'numeric' => 'Поле :attribute не должно быть больше :max.'],
    'required' => 'Поле :attribute обязательно для заполнения.',
    'string' => 'Поле :attribute должно быть строкой.',
    'unique' => 'Такой :attribute уже занят.',
    'attributes' => [
        'name' => 'имя',
        'email' => 'email',
        'password' => 'пароль',
        'password_confirmation' => 'подтверждение пароля',
        'birth_date' => 'дата рождения',
        'birth_time' => 'время рождения',
        'birth_city' => 'город рождения',
        'city' => 'город',
        'gender' => 'пол',
    ],
];
