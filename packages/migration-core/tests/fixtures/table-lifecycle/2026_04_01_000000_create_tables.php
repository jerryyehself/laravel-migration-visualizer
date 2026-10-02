<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function ($table) {
            $table->id();
        });
        Schema::create('posts', function ($table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
        });
    }
};
