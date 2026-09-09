<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Calendar;

class CalendarSeeder extends Seeder {
    public function run(): void {
        $items = [
            ['slug'=>'holidays','emoji'=>'🎉','name'=>'Праздники','description'=>'Международные и национальные праздники на каждый день'],
            ['slug'=>'orthodox','emoji'=>'⛪','name'=>'Православный','description'=>'Великие праздники и дни памяти святых'],
            ['slug'=>'muslim','emoji'=>'☪️','name'=>'Мусульманский','description'=>'Рамадан, Ураза-байрам и другие даты'],
            ['slug'=>'lunar','emoji'=>'🌙','name'=>'Лунный','description'=>'Лунные дни, фазы, рекомендации'],
            ['slug'=>'gardener','emoji'=>'🌱','name'=>'Садовода','description'=>'Благоприятные дни для посадки и сбора'],
            ['slug'=>'haircut','emoji'=>'💇','name'=>'Стрижки','description'=>'Когда стричься, чтобы волосы росли густыми'],
            ['slug'=>'names','emoji'=>'👼','name'=>'Именины','description'=>'День ангела и святые покровители'],
        ];
        foreach ($items as $it) Calendar::updateOrCreate(['slug'=>$it['slug']],$it);
    }
}
