<?php
return new class extends Migration {
    public function up(): void {
        Schema::table('accounts', function ($table) {
            $table->dropUnique(['email']);
            $table->renameColumn('email', 'contact');
            $table->unique(['tenant_id', 'contact']);
        });
    }
};
