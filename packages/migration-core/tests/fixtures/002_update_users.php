<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema as DB;
class UpdateUsers extends Migration {
    public function up(): void {
        DB::table('users', function (Blueprint $blueprint) {
            $blueprint->text('bio')->nullable()->default(null);
            $blueprint->unsignedInteger('score')->default(0);
            $blueprint->renameColumn('name', 'display_name');
            $blueprint->dropColumn('email');
        });
    }
}
