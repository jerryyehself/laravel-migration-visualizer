<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::table('posts', function ($table) {
            $table->dropForeign('posts_author_fk');
            $table->dropColumn('author_id');
        });
    }
};
