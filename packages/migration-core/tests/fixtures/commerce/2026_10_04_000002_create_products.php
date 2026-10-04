<?php
return new class extends Migration {
    function up(): void {
        Schema::create('products', function($t) {
            $t->id(); $t->string('sku')->unique(); $t->decimal('price',8,2);
        });
    }
};
