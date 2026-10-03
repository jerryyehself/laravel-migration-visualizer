<?php return new class extends Migration { function up() { Schema::create('tags', function($t) { $t->string('keep'); $t->numericMorphs('n'); $t->nullableUuidMorphs('u','custom'); }); } };
