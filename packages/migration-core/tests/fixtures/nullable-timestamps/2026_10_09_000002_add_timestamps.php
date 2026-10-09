<?php
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function ($t) { $t->nullableTimestamps(3); });
    }
};
