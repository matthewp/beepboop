// No need to import bb - we're just exporting standalone schema functions

// Utility function for creating objects (matching bb.js style)
let create = (proto, descriptor) => Object.freeze(Object.create(proto, descriptor || {}));

// Validation functions for complex types that need bind
function validateObject(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {
      issues: [{
        message: `Expected object, got ${Array.isArray(input) ? 'array' : typeof input}`,
        path: []
      }]
    };
  }

  const result = {};
  const issues = [];
  
  // Validate each property using its schema (this.properties available via bind)
  for (const [key, schema] of Object.entries(this.properties)) {
    const propResult = schema['~standard'].validate(input[key]);
    if ('issues' in propResult) {
      // Add path context to issues
      issues.push(...propResult.issues.map(issue => ({
        ...issue, 
        path: [key, ...issue.path]
      })));
    } else {
      result[key] = propResult.value;
    }
  }
  
  return issues.length > 0 ? { issues } : { value: result };
}

function validateArray(input) {
  if (!Array.isArray(input)) {
    return {
      issues: [{
        message: `Expected array, got ${typeof input}`,
        path: []
      }]
    };
  }

  const result = [];
  const issues = [];
  
  // Validate each item using the element schema (this.elementSchema available via bind)
  if (this.elementSchema) {
    for (let i = 0; i < input.length; i++) {
      const itemResult = this.elementSchema['~standard'].validate(input[i]);
      if ('issues' in itemResult) {
        issues.push(...itemResult.issues.map(issue => ({
          ...issue, 
          path: [i, ...issue.path]
        })));
      } else {
        result[i] = itemResult.value;
      }
    }
  } else {
    // No element schema - accept any array
    return { value: input };
  }
  
  return issues.length > 0 ? { issues } : { value: result };
}


// Base Standard Schema prototype
let BaseSchema = {
  '~standard': {
    version: 1,
    vendor: 'beepboop'
  }
};

// String schema prototype inheriting from BaseSchema
let StringSchema = Object.create(BaseSchema);
StringSchema['~standard'] = create(BaseSchema['~standard'], {
  validate: {
    value: (input) => {
      if (typeof input === 'string') {
        return { value: input };
      }
      return { 
        issues: [{ 
          message: `Expected string, got ${typeof input}`,
          path: []
        }] 
      };
    }
  }
});

// Number schema prototype inheriting from BaseSchema  
let NumberSchema = Object.create(BaseSchema);
NumberSchema['~standard'] = create(BaseSchema['~standard'], {
  validate: {
    value: (input) => {
      if (typeof input === 'number' && !isNaN(input)) {
        return { value: input };
      }
      return { 
        issues: [{ 
          message: `Expected number, got ${typeof input}`,
          path: []
        }] 
      };
    }
  }
});

// Boolean schema prototype inheriting from BaseSchema
let BooleanSchema = Object.create(BaseSchema);
BooleanSchema['~standard'] = create(BaseSchema['~standard'], {
  validate: {
    value: (input) => {
      if (typeof input === 'boolean') {
        return { value: input };
      }
      return { 
        issues: [{ 
          message: `Expected boolean, got ${typeof input}`,
          path: []
        }] 
      };
    }
  }
});

// Generic type schema prototype inheriting from BaseSchema
let TypeSchema = Object.create(BaseSchema);
TypeSchema['~standard'] = create(BaseSchema['~standard'], {
  validate: {
    value: (input) => {
      // Generic type accepts anything
      return { value: input };
    }
  }
});

// Array schema prototype inheriting from BaseSchema
let ArraySchema = Object.create(BaseSchema);
ArraySchema['~standard'] = create(BaseSchema['~standard'], {
  validate: { value: validateArray }
});

// Object schema prototype inheriting from BaseSchema
let ObjectSchema = Object.create(BaseSchema);
ObjectSchema['~standard'] = create(BaseSchema['~standard'], {
  validate: { value: validateObject }
});

// Factory functions
const createObjectSchema = (properties) => {
  return create(ObjectSchema, {
    properties: { value: properties },
    '~standard': {
      value: create(BaseSchema['~standard'], {
        validate: { value: validateObject.bind({ properties }) }
      })
    }
  });
};

const createArraySchema = (elementSchema) => {
  if (elementSchema) {
    return create(ArraySchema, {
      elementSchema: { value: elementSchema },
      '~standard': {
        value: create(BaseSchema['~standard'], {
          validate: { value: validateArray.bind({ elementSchema }) }
        })
      }
    });
  } else {
    return create(ArraySchema);
  }
};

// Export schema factory functions
export const string = () => create(StringSchema);
export const number = () => create(NumberSchema);
export const boolean = () => create(BooleanSchema);
export const object = (properties) => createObjectSchema(properties);
export const array = (elementSchema) => createArraySchema(elementSchema);
export const type = () => create(TypeSchema);