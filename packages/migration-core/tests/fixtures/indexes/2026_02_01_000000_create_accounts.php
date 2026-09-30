<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->integer('tenant_id');
            $table->index(['tenant_id', 'email'], 'tenant_lookup');
        });
    }
};
