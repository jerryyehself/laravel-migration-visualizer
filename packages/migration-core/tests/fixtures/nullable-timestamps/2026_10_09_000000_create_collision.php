<?php
return new class extends Migration {
    public function up(): void {
        Schema::create('users', function ($t) { $t->boolean('updated_at'); });
    }
};
