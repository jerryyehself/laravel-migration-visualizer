<?php
return new class extends Migration {
    function up(): void {
        Schema::table('attachments', function($t) {
            $t->nullableUuidMorphs('owner','owner_lookup');
        });
    }
};
