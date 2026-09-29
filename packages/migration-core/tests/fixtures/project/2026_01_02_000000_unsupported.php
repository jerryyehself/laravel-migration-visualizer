<?php
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function ($table) {
            $table->text('bio');
            $table->string('email')->unique();
        });
    }
};
