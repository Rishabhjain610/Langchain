from pydantic import BaseModel, Field
from typing import Optional
class Person(BaseModel):
    name: str = Field(description="Person's name")
    age: int = Field(description="Person's age")
    email: Optional[str] = Field(default=None, description="Person's email")
    cgpa:float=Field(gt=0,lt=10)
    

person = Person(name="John", age=30)
print(person)
new_Student={'name':'jain','age':'21','email':'[jain@gmail.com]'}

student=Person.model_validate(new_Student)
print(student)