<?php
return new class extends Migration {
    function up(): void {
        Schema::create('order_items', function($t) {
            $t->id(); $t->foreignId('order_id')->constrained()->cascadeOnDelete(); $t->foreignId('product_id')->constrained(); $t->unsignedInteger('qty');
        });
    }
};
