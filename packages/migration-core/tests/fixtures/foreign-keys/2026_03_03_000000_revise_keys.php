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
            $table->renameColumn('user_id', 'author_id');
            $table->dropForeign('posts_user_id_foreign');
            $table->foreign('author_id', 'posts_author_fk')->references('user_key')->on('users')->cascadeOnDelete();
        });
    }
};
