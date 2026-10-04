<?php
return new class extends Migration {
    function up(): void {
        Schema::table('orders', function($t) {
            $t->renameIndex('orders_status_index','orders_state_idx');
        });
    }
};
