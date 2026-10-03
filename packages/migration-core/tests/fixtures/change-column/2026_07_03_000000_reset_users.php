<?php
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function ($table) {
            $table->dateTimeTz('at', 3)->change();
        });
    }
};
