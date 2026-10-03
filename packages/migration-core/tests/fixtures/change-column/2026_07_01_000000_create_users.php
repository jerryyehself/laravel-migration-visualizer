<?php
return new class extends Migration {
    public function up(): void {
        Schema::create('users', function ($table) {
            $table->string('name', 25)->nullable()->default('old')->comment('old')->unique();
            $table->dateTimeTz('at', 6)->useCurrent();
        });
    }
};
