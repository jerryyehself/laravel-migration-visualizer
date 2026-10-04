<?php
return new class extends Migration {
    function up(): void {
        Schema::table('products', function($t) {
            $t->decimal('price',10,2)->nullable()->default(0)->change();
        });
    }
};
