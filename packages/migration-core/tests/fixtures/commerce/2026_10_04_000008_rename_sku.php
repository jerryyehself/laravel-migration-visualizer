<?php
return new class extends Migration {
    function up(): void {
        Schema::table('products', function($t) {
            $t->renameColumn('sku','code');
        });
    }
};
