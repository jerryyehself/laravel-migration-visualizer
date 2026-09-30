<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('posts', function ($table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete()->cascadeOnUpdate();
        });
    }
};
