<?php
return new class extends Migration {
    function up(): void {
        Schema::create('orders', function($t) {
            $t->id(); $t->foreignId('user_id')->constrained(); $t->enum('status',['pending','paid'])->default('pending'); $t->index('status');
        });
    }
};
