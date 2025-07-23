import type { StandardSchemaV1 } from '@standard-schema/spec';

// BeepBoop string schema
export interface BeepBoopString extends StandardSchemaV1<string, string> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: 'beepboop';
    readonly validate: (input: unknown) => 
      | { value: string }
      | { issues: Array<{ message: string; path: Array<string | number> }> };
    readonly types: {
      readonly input: string;
      readonly output: string;
    };
  };
}

// BeepBoop number schema  
export interface BeepBoopNumber extends StandardSchemaV1<number, number> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: 'beepboop';
    readonly validate: (input: unknown) => 
      | { value: number }
      | { issues: Array<{ message: string; path: Array<string | number> }> };
    readonly types: {
      readonly input: number;
      readonly output: number;
    };
  };
}

// BeepBoop boolean schema
export interface BeepBoopBoolean extends StandardSchemaV1<boolean, boolean> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: 'beepboop';
    readonly validate: (input: unknown) => 
      | { value: boolean }
      | { issues: Array<{ message: string; path: Array<string | number> }> };
    readonly types: {
      readonly input: boolean;
      readonly output: boolean;
    };
  };
}

// Helper type to infer object schema output from properties
type InferObjectProperties<T extends Record<string, StandardSchemaV1>> = {
  [K in keyof T]: StandardSchemaV1.InferOutput<T[K]>;
} & {};

// BeepBoop object schema
export interface BeepBoopObject<T extends Record<string, StandardSchemaV1>> 
  extends StandardSchemaV1<InferObjectProperties<T>, InferObjectProperties<T>> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: 'beepboop';
    readonly validate: (input: unknown) => 
      | { value: InferObjectProperties<T> }
      | { issues: Array<{ message: string; path: Array<string | number> }> };
    readonly types: {
      readonly input: InferObjectProperties<T>;
      readonly output: InferObjectProperties<T>;
    };
  };
}

// BeepBoop array schema
export interface BeepBoopArray<T extends StandardSchemaV1 = StandardSchemaV1<any, any>> 
  extends StandardSchemaV1<Array<StandardSchemaV1.InferInput<T>>, Array<StandardSchemaV1.InferOutput<T>>> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: 'beepboop';
    readonly validate: (input: unknown) => 
      | { value: Array<StandardSchemaV1.InferOutput<T>> }
      | { issues: Array<{ message: string; path: Array<string | number> }> };
    readonly types: {
      readonly input: Array<StandardSchemaV1.InferInput<T>>;
      readonly output: Array<StandardSchemaV1.InferOutput<T>>;
    };
  };
}

// BeepBoop generic type schema
export interface BeepBoopType<T = any> extends StandardSchemaV1<T, T> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: 'beepboop';
    readonly validate: (input: unknown) => 
      | { value: T }
      | { issues: Array<{ message: string; path: Array<string | number> }> };
    readonly types: {
      readonly input: T;
      readonly output: T;
    };
  };
}

// Standalone schema factory functions - use with import * as s from '@matthewp/beepboop/schema'
export function string(): BeepBoopString;
export function number(): BeepBoopNumber;
export function boolean(): BeepBoopBoolean;
export function object<T extends Record<string, StandardSchemaV1>>(properties: T): BeepBoopObject<T>;
export function array<T extends StandardSchemaV1>(elementSchema?: T): BeepBoopArray<T>;
export function type<T = any>(): BeepBoopType<T>;
