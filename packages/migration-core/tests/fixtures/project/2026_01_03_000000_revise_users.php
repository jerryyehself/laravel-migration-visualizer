<?php
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function ($table) {
            $table->dropColumn('nickname');
            $table->dropColumn('display_name');
            $table->string('display_name', 200)->nullable();
        });
    }
};
