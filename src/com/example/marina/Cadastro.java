package com.example.marina;

public class Cadastro {
	private int id;
	private String nome;
	private String bcartao;
	private String ncartao;
	private String senha;
	
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public String getNome() {
		return nome;
	}
	public void setNome(String nome) {
		this.nome = nome;
	}
	public String getBcartao() {
		return bcartao;
	}
	public void setBcartao(String bcartao) {
		this.bcartao = bcartao;
	}
	public String getNcartao() {
		return ncartao;
	}
	public void setNcartao(String ncartao) {
		this.ncartao = ncartao;
	}
	public String getSenha() {
		return senha;
	}
	public void setSenha(String senha) {
		this.senha = senha;
	}
 
	@Override
	public String toString(){
		return id + "-" + nome;
			
	}
	
}
