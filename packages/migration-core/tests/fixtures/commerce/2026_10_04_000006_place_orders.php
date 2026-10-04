<?php
return new class extends Migration {
    function up(): void {
        Schema::table('orders', function($t) {
            $t->timestamp('placed_at')->useCurrent();
        });
    }
};
