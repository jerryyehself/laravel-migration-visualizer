<?php
return new class extends Migration {
    public function up(): void {
        Schema::create('users', function ($table) {
            $table->id();
            $table->string('name', 120);
        });
    }
};
