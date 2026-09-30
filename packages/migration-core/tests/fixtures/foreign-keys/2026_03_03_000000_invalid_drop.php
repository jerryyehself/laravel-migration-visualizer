<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function ($table) {
            $table->renameColumn('id', 'user_key');
        });
        Schema::table('posts', function ($table) {
            $table->text('temp');
            $table->dropColumn('user_id');
        });
    }
};
