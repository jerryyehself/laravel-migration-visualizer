<?php
return new class extends Migration {
    public function up(): void {
        Schema::table('accounts', function ($table) {
            $table->dropPrimary();
            $table->primary(['tenant_id', 'contact'], 'accounts_key');
        });
    }
};
