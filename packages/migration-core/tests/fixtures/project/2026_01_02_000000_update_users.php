<?php
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function ($table) {
            $table->string('nickname')->nullable();
            $table->renameColumn('name', 'display_name');
        });
    }
};
