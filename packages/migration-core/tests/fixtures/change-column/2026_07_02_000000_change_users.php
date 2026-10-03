<?php
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function ($table) {
            $table->string('name', 50)->change();
            $table->dateTimeTz('at', 3)->nullable()->useCurrent()->change();
        });
    }
};
